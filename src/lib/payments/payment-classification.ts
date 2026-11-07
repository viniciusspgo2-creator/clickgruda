/** Domínios reservados para exemplos (IANA), usados em simulações da Cakto.
 * A classificação organiza relatórios; não modifica eventos, contas ou acesso.
 * Não há lista de clientes reais: novas compras reais continuam automáticas. */
export const CAKTO_TEST_EMAIL_PATTERN = '@example[.](com|net|org)$'
const testEmail = new RegExp(CAKTO_TEST_EMAIL_PATTERN, 'i')
export function isCaktoTestEmail(email: string): boolean {
  return testEmail.test(email.trim())
}
