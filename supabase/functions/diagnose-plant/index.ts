import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image URL to prevent SSRF attacks
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl || !imageUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/plant-images/`)) {
      console.error('Invalid image URL:', imageUrl);
      return new Response(
        JSON.stringify({ error: 'Invalid image URL. Only images from the plant-images storage bucket are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing plant image with AI...');

    // Lovable AI ile görüntü analizi (Vision model)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Sen bir bitki hastalıkları uzmanısın. Bitki fotoğraflarını analiz edip hastalık teşhisi koyuyorsun. 
            Yanıt formatı: JSON objesi olarak sadece şu alanları döndür:
            {
              "disease": "Hastalık adı (Türkçe)",
              "confidence": sayı (0-100 arası güven skoru),
              "description": "Hastalık hakkında detaylı açıklama (Türkçe, 2-3 cümle)",
              "advice": "Tedavi önerileri (Türkçe, madde işaretli liste)"
            }
            
            Eğer bitki sağlıklı görünüyorsa disease: "Sağlıklı Bitki" olarak belirt.
            Sadece JSON döndür, başka açıklama ekleme.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Bu bitkiyi analiz et ve hastalık teşhisi koy.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI kredisi tükendi. Lütfen yöneticinizle iletişime geçin.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analizi başarısız oldu' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      console.error('No AI response content');
      return new Response(
        JSON.stringify({ error: 'AI yanıtı alınamadı' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Response:', aiContent);

    // JSON parse et
    let diagnosis;
    try {
      // Markdown code block varsa temizle
      const cleanJson = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      diagnosis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('AI Content:', aiContent);
      return new Response(
        JSON.stringify({ error: 'AI yanıtı işlenemedi' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validasyon
    if (!diagnosis.disease || typeof diagnosis.confidence !== 'number' || 
        !diagnosis.description || !diagnosis.advice) {
      console.error('Invalid diagnosis format:', diagnosis);
      return new Response(
        JSON.stringify({ error: 'Geçersiz teşhis formatı' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Veritabanına kaydet
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // JWT'den user ID al
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        const { error: insertError } = await supabase
          .from('diagnoses')
          .insert({
            user_id: user.id,
            image_url: imageUrl,
            disease: diagnosis.disease,
            confidence: diagnosis.confidence,
            description: diagnosis.description,
            advice: diagnosis.advice,
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
        }
      }
    }

    return new Response(
      JSON.stringify(diagnosis),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});