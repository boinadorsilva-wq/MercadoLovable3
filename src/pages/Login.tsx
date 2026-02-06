import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, ShoppingCart, TrendingUp, Shield, Zap, Clock, Star, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "Conta criada com sucesso!",
          description: "Você já pode acessar o painel.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, title: "Aumento de Lucro", desc: "Análises preditivas de margem e preço baseadas em histórico real." },
    { icon: Zap, title: "Setup Instantâneo", desc: "Importe seus produtos e comece a gerenciar hoje mesmo." },
    { icon: Shield, title: "Segurança Máxima", desc: "Criptografia de ponta a ponta para todos os seus dados." },
    { icon: Clock, title: "Time em Sincronia", desc: "Acesse de qualquer lugar com controle total de usuários." },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">MercadoPro</span>
          </div>

          {/* Hero */}
          <h1 className="text-5xl xl:text-6xl font-display font-bold text-foreground leading-tight mb-6">
            Gestão e{" "}
            <span className="text-gradient-primary">Lucratividade</span>
            <br />
            com IA em segundos.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mb-10">
            O MercadoPro automatiza seu planejamento, otimiza seu estoque e gera relatórios inteligentes para você vender mais.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 mb-10">
            <Button onClick={() => setIsLogin(false)} className="rounded-full px-6">
              Começar Agora
            </Button>
            <Button variant="outline" className="rounded-full px-6">
              Ver Demonstração
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-2 mb-16">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-warning text-warning" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Aprovado por +500 estabelecimentos no Brasil</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {/* Form Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold text-foreground">MercadoPro</span>
            </div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-1">
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              {isLogin ? "Bem-vindo de volta! Digite seus dados." : "Preencha os dados para começar."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Manter conectado
                    </label>
                  </div>
                  <button type="button" className="text-sm text-primary font-medium hover:underline">
                    Recuperar senha
                  </button>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full h-12 rounded-xl text-base gap-2" disabled={loading}>
                {loading ? "Carregando..." : isLogin ? "Entrar no Painel" : "Criar Conta"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "Cadastre-se grátis" : "Fazer login"}
              </button>
            </p>

            {/* Admin access note */}
            {isLogin && (
              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  Acesso Administrativo
                </p>
                <p className="text-xs text-muted-foreground">
                  Ambiente de demonstração local. Qualquer credencial válida permite o acesso.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
