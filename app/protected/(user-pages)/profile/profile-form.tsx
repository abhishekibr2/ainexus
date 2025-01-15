"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { Lock } from "lucide-react"
import { z } from "zod"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/utils/supabase/actions/user/profile"
import { createClient } from "@/utils/supabase/client"
import { getProfile } from "@/utils/supabase/actions/user/profile"
import { Skeleton } from "@/components/ui/skeleton"

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: "Please enter a valid URL." }),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const [userEmail, setUserEmail] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState<Partial<ProfileFormValues>>({
    username: "",
    bio: "",
  })
  const supabase = createClient()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })
  useEffect(() => {
    async function initialize() {
      setIsLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        setIsLoading(false)
        toast({
          title: "Error",
          description: "Could not fetch user data.",
          variant: "destructive",
        })
        return
      }
      if (user?.email && user?.id) {
        setUserEmail(user.email)
        setUserId(user.id)

        try {
          const profile = await getProfile(user.id)
          if (profile) {
            setDefaultValues({
              username: profile.username || "",
              bio: profile.bio || "",
            })
            form.reset({
              username: profile.username || "",
              bio: profile.bio || "",
            })
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Could not fetch profile data.",
            variant: "destructive",
          })
        }
      }
      setIsLoading(false)
    }
    initialize()
  }, [form, supabase.auth])

  const { fields, append } = useFieldArray({
    name: "urls",
    control: form.control,
  })

  async function onSubmit(data: ProfileFormValues) {
    try {
      if (!userId) {
        throw new Error("User ID not found")
      }
      await updateProfile(data, userId)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-full max-w-[250px]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-full max-w-[250px]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-full max-w-[250px]" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a
                pseudonym. You can only change this once every 30 days.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Email</FormLabel>
          <div className="flex items-center space-x-2">
            <Input
              type="email"
              value={userEmail}
              disabled
              className="bg-muted"
            />
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <FormDescription>
            Your email address is locked and cannot be changed.
          </FormDescription>
        </FormItem>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to
                link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  )
}
