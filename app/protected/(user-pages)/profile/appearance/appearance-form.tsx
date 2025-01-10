"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { updateAppearance, getProfile } from "@/utils/supabase/actions/user/profile"
import { createClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark"], {
    required_error: "Please select a theme.",
  }),
  font: z.enum(["inter", "manrope", "system"], {
    invalid_type_error: "Select a font",
    required_error: "Please select a font.",
  }),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceForm() {
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme()
  const [defaultValues, setDefaultValues] = useState<Partial<AppearanceFormValues>>({
    theme: "light",
    font: "inter"
  })
  const supabase = createClient()

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
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
      if (user?.id) {
        setUserId(user.id)
        
        try {
          const profile = await getProfile(user.id)
          if (profile) {
            const savedTheme = profile.theme || theme || "light"
            setTheme(savedTheme)
            
            setDefaultValues({
              theme: savedTheme,
              font: profile.font || "inter"
            })
            form.reset({
              theme: savedTheme,
              font: profile.font || "inter"
            })
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Could not fetch appearance preferences.",
            variant: "destructive",
          })
        }
      }
      setIsLoading(false)
    }

    initialize()
  }, [form, supabase.auth, theme, setTheme])

  async function onSubmit(data: AppearanceFormValues) {
    try {
      if (!userId) {
        throw new Error("User ID not found")
      }
      await updateAppearance(data, userId)
      toast({
        title: "Appearance updated",
        description: "Your appearance preferences have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleThemeChange = async (newTheme: "light" | "dark") => {
    try {
      setTheme(newTheme)
      form.setValue("theme", newTheme)
      
      if (userId) {
        await updateAppearance({
          ...form.getValues(),
          theme: newTheme
        }, userId)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update theme. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "theme" && value.theme) {
        setTheme(value.theme)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, setTheme])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full max-w-[250px]" />
          <div className="grid max-w-md grid-cols-2 gap-8">
            <div className="space-y-2">
              <Skeleton className="h-[120px] w-full" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-[120px] w-full" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full max-w-[250px]" />
          <Skeleton className="h-10 w-[200px]" />
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
          name="font"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font</FormLabel>
              <div className="relative w-max">
                <FormControl>
                  <select
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-[200px] appearance-none font-normal"
                    )}
                    {...field}
                  >
                    <option value="inter">Inter</option>
                    <option value="manrope">Manrope</option>
                    <option value="system">System</option>
                  </select>
                </FormControl>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
              </div>
              <FormDescription>
                Set the font you want to use in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Theme</FormLabel>
              <FormDescription>
                Select the theme for the dashboard.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={handleThemeChange}
                defaultValue={field.value}
                className="grid max-w-md grid-cols-2 gap-8 pt-2"
              >
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="light" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Light
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="dark" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Dark
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />
        <Button type="submit">Update preferences</Button>
      </form>
    </Form>
  )
}
