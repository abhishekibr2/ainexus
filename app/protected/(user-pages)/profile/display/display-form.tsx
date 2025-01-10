"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateDisplay, getProfile } from "@/utils/supabase/actions/user/profile"
import { createClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

const items = [
  {
    id: "recents",
    label: "Recents",
  },
  {
    id: "home",
    label: "Home",
  },
  {
    id: "applications",
    label: "Applications",
  },
  {
    id: "desktop",
    label: "Desktop",
  },
  {
    id: "downloads",
    label: "Downloads",
  },
  {
    id: "documents",
    label: "Documents",
  },
] as const

const displayFormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
})

type DisplayFormValues = z.infer<typeof displayFormSchema>

export function DisplayForm() {
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState<Partial<DisplayFormValues>>({
    items: ["recents", "home"],
  })
  const supabase = createClient()
  
  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
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
            const sidebarItems = profile.sidebar || ["recents", "home"]
            setDefaultValues({
              items: sidebarItems
            })
            form.reset({
              items: sidebarItems
            })
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Could not fetch display preferences.",
            variant: "destructive",
          })
        }
      }
      setIsLoading(false)
    }

    initialize()
  }, [form, supabase.auth])

  async function onSubmit(data: DisplayFormValues) {
    try {
      if (!userId) {
        throw new Error("User ID not found")
      }
      await updateDisplay(data, userId)
      toast({
        title: "Display preferences updated",
        description: "Your display preferences have been updated successfully.",
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
        <div className="space-y-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full max-w-[250px]" />
          <div className="space-y-3">
            {items.map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
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
          name="items"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Sidebar</FormLabel>
                <FormDescription>
                  Select the items you want to display in the sidebar.
                </FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="items"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update display</Button>
      </form>
    </Form>
  )
}
