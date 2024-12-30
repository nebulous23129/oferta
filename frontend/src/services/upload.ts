import { supabase } from '@/lib/supabase';

// Constantes de validação
const FILE_VALIDATION = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
};

// Função para sanitizar nome de arquivo
function sanitizeFileName(fileName: string): string {
  // Remove caracteres especiais e espaços
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
}

// Função para validar tipo de arquivo
function validateFileType(file: File): void {
  if (!FILE_VALIDATION.allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não suportado. Use: ${FILE_VALIDATION.allowedTypes.join(', ')}`);
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !FILE_VALIDATION.allowedExtensions.includes(extension)) {
    throw new Error(`Extensão de arquivo não permitida. Use: ${FILE_VALIDATION.allowedExtensions.join(', ')}`);
  }
}

// Função para validar tamanho do arquivo
function validateFileSize(file: File): void {
  if (file.size > FILE_VALIDATION.maxSize) {
    throw new Error(`Arquivo muito grande. Limite máximo: ${FILE_VALIDATION.maxSize / (1024 * 1024)}MB`);
  }
}

// Cache para controle de rate limit
const uploadRateLimit = new Map<string, { count: number; timestamp: number }>();

// Função para verificar rate limit
function checkRateLimit(productId: string): void {
  const now = Date.now();
  const limit = uploadRateLimit.get(productId);

  if (limit) {
    // Reseta o contador após 1 hora
    if (now - limit.timestamp > 3600000) {
      uploadRateLimit.set(productId, { count: 1, timestamp: now });
      return;
    }

    if (limit.count >= 10) { // Máximo de 10 uploads por hora por produto
      throw new Error('Limite de uploads excedido. Tente novamente em 1 hora.');
    }

    uploadRateLimit.set(productId, { count: limit.count + 1, timestamp: limit.timestamp });
  } else {
    uploadRateLimit.set(productId, { count: 1, timestamp: now });
  }
}

// Função para fazer upload de imagem do produto
export async function uploadProductImage(file: File, productId: string) {
  try {
    // Validações iniciais
    if (!file || !productId) {
      throw new Error('Arquivo e ID do produto são obrigatórios');
    }

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Validações do arquivo
    validateFileType(file);
    validateFileSize(file);
    
    // Verifica rate limit
    checkRateLimit(productId);

    const bucketName = 'product-images';

    // Prepara o nome do arquivo
    const fileName = sanitizeFileName(`${productId}-${file.name}`);
    const filePath = `${productId}/${fileName}`;

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erro no upload:', error);
      throw error;
    }

    // Pega a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Atualiza a URL da imagem no produto
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('product_id', productId);

    if (updateError) {
      console.error('Erro ao atualizar produto:', updateError);
      throw updateError;
    }

    return publicUrl;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
}

// Função para deletar imagem do produto
export async function deleteProductImage(productId: string) {
  try {
    if (!productId) {
      throw new Error('ID do produto é obrigatório');
    }

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Log seguro do início da deleção
    console.log(`🔄 Iniciando deleção de imagem do produto: ${productId}`);

    // Lista arquivos do produto
    const { data: files, error: listError } = await supabase.storage
      .from('images')
      .list(`products/${productId}`);

    if (listError) {
      console.error('❌ Erro ao listar arquivos:', {
        productId,
        errorMessage: listError.message
      });
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log(`ℹ️ Nenhuma imagem encontrada para o produto: ${productId}`);
      return;
    }

    // Deleta cada arquivo
    for (const file of files) {
      const { error: deleteError } = await supabase.storage
        .from('images')
        .remove([`products/${productId}/${file.name}`]);

      if (deleteError) {
        console.error('❌ Erro ao deletar arquivo:', {
          productId,
          fileName: file.name,
          errorMessage: deleteError.message
        });
        throw deleteError;
      }
    }

    // Log seguro do sucesso
    console.log(`✅ Imagens deletadas com sucesso para o produto: ${productId}`);

  } catch (error) {
    console.error('❌ Erro no processo de deleção:', error instanceof Error ? error.message : 'Erro desconhecido');
    throw error;
  }
}
