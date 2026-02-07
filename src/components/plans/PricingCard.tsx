import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingFeature {
    text: string;
    included: boolean;
}

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    description?: string;
    features: PricingFeature[];
    isPopular?: boolean;
    buttonText?: string;
    onSubscribe: () => void;
}

export function PricingCard({
    title,
    price,
    period,
    description,
    features,
    isPopular = false,
    buttonText = "Assinar Agora",
    onSubscribe,
}: PricingCardProps) {
    return (
        <Card
            className={cn(
                "relative flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                isPopular ? "border-primary shadow-md scale-105 z-10" : "border-border"
            )}
        >
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                    Mais Popular
                </div>
            )}
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-foreground">R$ {price}</span>
                    <span className="text-muted-foreground">/{period}</span>
                </div>
                {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex justify-center mb-6">
                    <div className="h-1 w-12 bg-border rounded-full" />
                </div>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                                    feature.included
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                <Check className="h-3 w-3" />
                            </div>
                            <span className={cn(!feature.included && "text-muted-foreground line-through")}>
                                {feature.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button
                    className={cn("w-full", isPopular ? "default" : "variant='outline'")}
                    variant={isPopular ? "default" : "outline"}
                    onClick={onSubscribe}
                >
                    {buttonText}
                </Button>
            </CardFooter>
        </Card>
    );
}
