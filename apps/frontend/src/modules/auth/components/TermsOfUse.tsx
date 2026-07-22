import { X } from 'lucide-react';
import React from 'react';

interface TermsOfUseProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-700 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">
            Termos de Uso e Responsabilidade
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-slate-700 dark:text-dark-200 leading-relaxed">
          <p className="text-slate-500 dark:text-dark-400 text-xs font-medium uppercase tracking-wider">
            Última atualização: Julho de 2026
          </p>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-50 mb-2">
              1. Aceite e Elegibilidade
            </h3>
            <p>
              Ao criar uma conta no <strong>Arandu</strong> ("Plataforma"), você declara
              ter lido, compreendido e aceitado integralmente estes Termos de Uso e
              Responsabilidade. Caso não concorde com qualquer disposição deste
              documento, você não deve utilizar a Plataforma.
            </p>
            <p className="mt-2">
              Para criar uma conta, você deve ter pelo menos <strong>16 (dezesseis) anos</strong>{' '}
              de idade. Se você for menor de 18 anos, declara que possui autorização
              de seus responsáveis legais para utilizar a Plataforma.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-50 mb-2">
              2. Responsabilidade do Usuário
            </h3>
            <p>
              <strong>2.1 Veracidade dos Dados:</strong> Você se compromete a fornecer
              informações verdadeiras, precisas e atualizadas durante o processo de
              cadastro e uso da Plataforma. O fornecimento de dados falsos ou
              fraudulentos poderá resultar na suspensão ou exclusão imediata da sua
              conta, sem prejuízo das demais medidas legais cabíveis.
            </p>
            <p className="mt-2">
              <strong>2.2 Segurança das Credenciais:</strong> Você é o único
              responsável pela guarda e sigilo da sua senha e demais credenciais de
              acesso. Qualquer atividade realizada através da sua conta será de sua
              inteira responsabilidade. Caso suspeite de uso não autorizado, você
              deve alterar imediatamente sua senha e notificar a equipe do Arandu.
            </p>
            <p className="mt-2">
              <strong>2.3 Conteúdo Armazenado:</strong> Você é o único responsável
              pelo conteúdo que criar, armazenar, editar ou compartilhar na
              Plataforma, incluindo textos, anotações, flashcards, questões e
              demais materiais de estudo.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-50 mb-2">
              3. Uso Aceitável da Plataforma
            </h3>
            <p>
              Você concorda em utilizar a Plataforma apenas para fins lícitos e de
              acordo com estes Termos. É expressamente proibido:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utilizar a Plataforma para atividades ilegais ou fraudulentas;</li>
              <li>
                Reproduzir, distribuir ou disponibilizar o conteúdo da Plataforma
                sem autorização prévia;
              </li>
              <li>
                Tentar acessar áreas restritas do sistema, realizar engenharia
                reversa, ou interferir na segurança da Plataforma;
              </li>
              <li>
                Armazenar ou compartilhar conteúdo ofensivo, difamatório,
                discriminatório ou que viole direitos de terceiros;
              </li>
              <li>
                Utilizar robôs, crawlers ou outros meios automatizados para
                extrair dados da Plataforma sem autorização.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-50 mb-2">
              4. Limitação de Responsabilidade
            </h3>
            <p>
              O Arandu é fornecido <strong>"no estado em que se encontra"</strong>,
              sem garantias de disponibilidade contínua ou ininterrupta. A
              Plataforma se esforça para manter a estabilidade e segurança do
              serviço, mas não se responsabiliza por:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Perda de dados decorrente de falhas técnicas, uso inadequado ou
                ação de terceiros;
              </li>
              <li>
                Danos diretos ou indiretos resultantes do uso ou da incapacidade
                de usar a Plataforma;
              </li>
              <li>
                Conteúdo criado por usuários que viole direitos de propriedade
                intelectual ou privacidade de terceiros.
              </li>
            </ul>
            <p className="mt-2">
              Recomenda-se que você mantenha cópias de segurança do seu conteúdo
              regularmente.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-50 mb-2">
              5. Privacidade e Dados Pessoais
            </h3>
            <p>
              O tratamento dos seus dados pessoais é realizado de acordo com a
              legislação aplicável, incluindo a Lei Geral de Proteção de Dados
              Pessoais (LGPD - Lei nº 13.709/2018). Ao utilizar a Plataforma,
              você consente com a coleta e tratamento dos seus dados para as
              finalidades descritas nesta seção.
            </p>
            <p className="mt-2">
              <strong>5.1 Dados Coletados:</strong> Coletamos seu nome, endereço
              de e-mail e demais informações fornecidas voluntariamente durante o
              cadastro e uso da Plataforma. O conteúdo das suas anotações e
              atividades de estudo é armazenado de forma segura e não é
              compartilhado com terceiros sem o seu consentimento.
            </p>
            <p className="mt-2">
              <strong>5.2 Finalidades:</strong> Seus dados são utilizados
              exclusivamente para: (a) operar e melhorar a Plataforma; (b) enviar
              comunicações relacionadas ao serviço (como confirmação de e-mail e
              recuperação de senha); e (c) cumprir obrigações legais.
            </p>
            <p className="mt-2">
              <strong>5.3 Compartilhamento:</strong> Não vendemos, alugamos ou
              compartilhamos seus dados pessoais com terceiros para fins de
              marketing. Podemos compartilhar dados anonimizados para fins
              estatísticos ou de melhoria do serviço.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-50 mb-2">
              6. Cancelamento e Exclusão de Conta
            </h3>
            <p>
              Você pode solicitar a exclusão da sua conta a qualquer momento
              através das configurações da Plataforma. Após a exclusão, seus
              dados pessoais serão removidos ou anonimizados em até 30 (trinta)
              dias, exceto quando a retenção for exigida por lei.
            </p>
            <p className="mt-2">
              O Arandu reserva-se o direito de suspender ou encerrar contas que
              violem estes Termos de Uso, mediante notificação prévia sempre que
              possível.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-50 mb-2">
              7. Disposições Gerais
            </h3>
            <p>
              <strong>7.1 Alterações nos Termos:</strong> Estes Termos podem ser
              atualizados periodicamente. Notificaremos você sobre alterações
              significativas através do e-mail cadastrado ou por meio de aviso na
              própria Plataforma. O uso continuado após as alterações constitui
              aceitação dos novos Termos.
            </p>
            <p className="mt-2">
              <strong>7.2 Lei Aplicável:</strong> Estes Termos são regidos pelas
              leis da República Federativa do Brasil. Qualquer disputa será
              resolvida no foro da comarca de domicílio do usuário.
            </p>
            <p className="mt-2">
              <strong>7.3 Contato:</strong> Para dúvidas sobre estes Termos ou
              sobre o tratamento dos seus dados, entre em contato conosco através
              do e-mail de suporte disponível na Plataforma.
            </p>
          </section>

          <p className="text-slate-400 dark:text-dark-500 text-xs text-center pt-2 border-t border-slate-100 dark:border-dark-700">
            Arandu • Plataforma de Estudos Inteligente
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-dark-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
