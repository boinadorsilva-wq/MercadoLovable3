import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, CreditCard, Shield, Settings as SettingsIcon } from 'lucide-react';

export default function Configuracoes() {
    const { user, signOut } = useAuth();
    const subscription = useSubscription();

    if (!user) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Perfil */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Perfil
                        </CardTitle>
                        <CardDescription>Suas informações de acesso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>ID do Usuário</Label>
                            <Input value={user.id} disabled className="font-mono text-xs" />
                        </div>
                        <Button variant="outline" onClick={() => signOut()} className="w-full">
                            Sair da Conta
                        </Button>
                    </CardContent>
                </Card>

                {/* Assinatura */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Assinatura
                        </CardTitle>
                        <CardDescription>Gerencie seu plano</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/50">
                            <div className="space-y-1">
                                <p className="font-medium">Status</p>
                                <div className="flex items-center gap-2">
                                    {subscription.isLoading ? (
                                        <span className="text-sm text-muted-foreground">Carregando...</span>
                                    ) : subscription.status === 'active' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Ativo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                            Inativo
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Shield className="h-8 w-8 text-primary opacity-20" />
                        </div>

                        {!subscription.isLoading && subscription.status === 'active' && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Expira em: {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {subscription.daysRemaining} dias restantes
                                </p>
                            </div>
                        )}

                        <Button className="w-full" asChild>
                            <a href="/planos">Ver Planos</a>
                        </Button>
                    </CardContent>
                </Card>

                {/* Configurações Gerais - Placeholder for future */}
                <Card className="md:col-span-2 opacity-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            Preferências (Em breve)
                        </CardTitle>
                        <CardDescription>Personalize sua experiência</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Novas configurações estarão disponíveis em breve.</p>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
