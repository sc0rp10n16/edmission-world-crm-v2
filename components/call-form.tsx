'use client'

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const callFormSchema = z.object({
  notes: z.string().optional(),
})

type CallFormValues = z.infer<typeof callFormSchema>

interface CallFormProps {
  lead: {
    id: string
    name: string
    phone: string
    email?: string
  }
  onSuccess: () => void
}

export function CallForm({ lead }: CallFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      notes: "",
    },
  })

  async function onSubmit(data: CallFormValues) {
    try {
      setIsLoading(true)
      
      // Placeholder for actual submission logic
      console.log('Call form submitted', data)

      toast({
        title: "Success",
        description: "Call details have been saved",
      })
      
      onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to save call details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add notes about the call..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSuccess}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}