import { AppLayout } from "@/components/layout/AppLayout";
import { PricingCard } from "@/components/plans/PricingCard";
import { Check, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Planos() {
    const handleSubscribe = (plan: string) => {
        // Fallback if actionUrl fails
        console.log(`Assinando plano: ${plan}`);
        // window.location.href = "https://wa.me/5511999999999?text=Olá, gostaria de assinar o plano " + plan;
    };

    const { user } = useAuth();

    const getCheckoutUrl = (baseUrl: string) => {
        if (!user) return baseUrl;

        const params = new URLSearchParams();
        if (user.email) params.append('email', user.email);

        // Tenta obter dados do metadata do usuário se existirem
        const metadata = user.user_metadata || {};
        if (metadata.full_name || metadata.name) params.append('name', metadata.full_name || metadata.name);
        if (metadata.cpf) params.append('cpf', metadata.cpf);
        if (metadata.phone) params.append('phone', metadata.phone);

        return `${baseUrl}?${params.toString()}`;
    };

    const commonFeatures = [
        { text: "Gestão de Produtos Ilimitada", included: true },
        { text: "Controle de Vendas e Estoque", included: true },
        { text: "Relatórios Detalhados", included: true },
        { text: "Suporte Prioritário", included: true },
        { text: "Dashboard em Tempo Real", included: true },
        { text: "Alertas de Estoque Baixo", included: true },
    ];

    return (
        <AppLayout>
            <div className="space-y-8 animate-fade-in pb-10">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h1 className="text-4xl font-display font-bold text-foreground">
                        Escolha o plano ideal para o seu negócio
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Comece a gerenciar seu mercado com inteligência e eficiência hoje mesmo.
                        Sem taxas escondidas, cancele quando quiser.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12 px-4">
                    <PricingCard
                        title="Mensal"
                        price="29,90"
                        period="mês"
                        description="Perfeito para quem está começando."
                        features={commonFeatures}
                        actionUrl={getCheckoutUrl("https://pay.cakto.com.br/yginmsb")}
                        onSubscribe={() => handleSubscribe("Mensal")}
                    />

                    <PricingCard
                        title="Trimestral"
                        price="72,90"
                        period="trimestre"
                        description="Economize e garanta 3 meses de gestão."
                        isPopular={true}
                        features={[
                            ...commonFeatures,
                            { text: "Consultoria Inicial Grátis", included: true },
                        ]}
                        onSubscribe={() => handleSubscribe("Trimestral")}
                        actionUrl={getCheckoutUrl("https://pay.cakto.com.br/ehfyy3k_757945")}
                        buttonText="Assinar Trimestral"
                    />

                    <PricingCard
                        title="Anual"
                        price="358,90"
                        period="ano"
                        description="Máxima economia para o seu negócio."
                        features={[
                            ...commonFeatures,
                            { text: "Consultoria Inicial Grátis", included: true },
                            { text: "Backup Automático em Nuvem", included: true },
                            { text: "Gestor de Conta Dedicado", included: true },
                        ]}
                        onSubscribe={() => handleSubscribe("Anual")}
                        actionUrl={getCheckoutUrl("https://pay.cakto.com.br/b64ubmg")}
                        buttonText="Assinar Anual"
                    />
                </div>

                <div className="mt-16 bg-muted/30 rounded-2xl p-8 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                        <Star className="h-6 w-6 text-primary fill-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Por que escolher o Gestãonegocio?</h3>
                    <ul className="text-left max-w-md mx-auto mt-6 space-y-3">
                        <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            <span>Plataforma 100% segura e na nuvem</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            <span>Acesso de qualquer lugar (Celular/PC)</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            <span>Atualizações constantes sem custo extra</span>
                        </li>
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
