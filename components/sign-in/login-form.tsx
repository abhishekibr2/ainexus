"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInAction, signUpWithGoogleAction } from "@/app/actions"
import { SubmitButton } from "../submit-button"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { FormMessage } from "../form-message"
import { useFormStatus } from "react-dom"
import { GoogleButton } from "./GoogleButton"
import { useTransition } from "react"

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <SubmitButton type="submit" className="w-full" disabled={pending}>
      {pending ? "Logging in..." : "Login"}
    </SubmitButton>
  )
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  const success = searchParams.get('success')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    const response = await signInAction(formData)
    if (response.success) {
      startTransition(() => {
        router.push(response.redirectTo)
      })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleButton />
          <form action={onSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" >Password</Label>
                    <Link
                      href="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password" type="password" name="password" required />
                </div>

                {error && (
                  <div className="mb-4">
                    <FormMessage message={{ message: error }} action="error" />
                  </div>
                )}
                {success && (
                  <div className="mb-4">
                    <FormMessage message={{ message: success }} action="success" />
                  </div>
                )}
                {message && (
                  <div className="mb-4">
                    <FormMessage message={{ message: message }} action="message" />
                  </div>
                )}
                <LoginButton />
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
