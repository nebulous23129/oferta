export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return false;
  }

  // Converte para array de números
  const cpfArray = cleanCPF.split('').map(Number);

  // Calcula primeiro dígito verificador
  const sum1 = cpfArray.slice(0, 9).reduce((acc, digit, index) => {
    return acc + digit * (10 - index);
  }, 0);

  const remainder1 = (sum1 * 10) % 11;
  const digit1 = remainder1 === 10 ? 0 : remainder1;

  if (digit1 !== cpfArray[9]) {
    return false;
  }

  // Calcula segundo dígito verificador
  const sum2 = cpfArray.slice(0, 10).reduce((acc, digit, index) => {
    return acc + digit * (11 - index);
  }, 0);

  const remainder2 = (sum2 * 10) % 11;
  const digit2 = remainder2 === 10 ? 0 : remainder2;

  return digit2 === cpfArray[10];
}
