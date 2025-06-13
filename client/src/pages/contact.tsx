import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Phone, Clock, Bell, BellOff } from "lucide-react";
import { useFormDataMemory } from "@/hooks/use-form-data-memory";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const subjects = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Support" },
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account Question" },
];

export default function Contact() {
  const { toast } = useToast();

  // Initialize form data memory for auto-save functionality
  const { 
    isReminded, 
    savedData, 
    toggleRemind, 
    updateSavedField,
    hasSavedData 
  } = useFormDataMemory('contact');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: savedData.name || "",
      email: savedData.email || "",
      subject: savedData.subject || "",
      message: savedData.message || "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Handle form field changes and auto-save when remind is enabled
  const handleFieldChange = (field: string, value: any) => {
    if (isReminded) {
      updateSavedField(field, value);
    }
  };

  // Toggle remind functionality
  const handleToggleRemind = () => {
    const currentFormData = form.getValues();
    const dataToSave = {
      name: currentFormData.name,
      email: currentFormData.email,
      subject: currentFormData.subject,
      message: currentFormData.message,
    };
    
    toggleRemind(dataToSave);
    
    if (!isReminded) {
      toast({
        title: "Data Saved",
        description: "Your contact details will be remembered for future messages.",
        variant: "default",
      });
    } else {
      toast({
        title: "Data Cleared",
        description: "Your saved contact details have been removed.",
        variant: "default",
      });
    }
  };

  const onSubmit = (data: ContactFormData) => {
    sendMessageMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-lg text-gray-600">Get in touch with our support team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900">support@doogleonline.com</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-sm text-gray-900">+252 61 234 5678</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Business Hours</p>
                <p className="text-sm text-gray-900">24/7 Online Support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How can we help you?"
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
