export const formatPhoneUS = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '').slice(-10); // solo últimos 10 dígitos
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
};
