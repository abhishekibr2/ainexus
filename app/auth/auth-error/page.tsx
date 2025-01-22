import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AuthError() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Authentication Error</CardTitle>
                    <CardDescription>
                        There was a problem with the authentication process.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This could be due to an expired or invalid authentication token, 
                        or because you cancelled the authentication process.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/protected/agents/explore-agents">
                            Return to Home
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
} 