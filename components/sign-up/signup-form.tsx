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
import { signUpAction } from "@/app/actions"
import { SubmitButton } from "../submit-button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FormMessage } from "../form-message"
import { useFormStatus } from "react-dom"
import { GoogleButton } from "../sign-in/GoogleButton"
import { useState } from "react"

function SignUpButton() {
  const { pending } = useFormStatus()
  return (
    <SubmitButton type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing up..." : "Sign up"}
    </SubmitButton>
  )
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [formMessage, setFormMessage] = useState<{ type: string; message: string } | null>(null)

  async function onSubmit(formData: FormData) {
    const response = await signUpAction(formData)
    if (response.success) {
      setFormMessage({ type: 'success', message: response.message })
    } else if (response.error) {
      setFormMessage({ type: 'error', message: response.message })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <GoogleButton />
          </div>
          <form action={onSubmit}>
            <div className="grid gap-6">
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
                  </div>
                  <Input id="password" type="password" name="password" required />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="confirm-password" >Confirm Password</Label>
                  </div>
                  <Input id="confirm-password" type="password" name="confirm-password" required />
                </div>
                {formMessage && (
                  <div className="mb-4">
                    <FormMessage message={{ message: formMessage.message }} action={formMessage.type} />
                  </div>
                )}
                <SignUpButton />
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Sign in
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
