import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { QrCode } from "lucide-react";
import { z } from "zod";

const eventFormSchema = z.object({
  user: z.string().min(1, "Participant is required"),
  action: z.string().min(1, "Action is required"),
  asset_id: z.string().min(1, "Asset ID is required"),
  location: z.string().optional(),
  metadata: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

const actionOptions = [
  { value: "manufactured", label: "Manufactured" },
  { value: "shipped", label: "Shipped" },
  { value: "received", label: "Received" },
  { value: "delivered", label: "Delivered" },
  { value: "quality_check", label: "Quality Check" },
  { value: "returned", label: "Returned" },
];

const templates = {
  manufacturing: {
    action: "manufactured",
    location: "Manufacturing Facility",
    metadata: '{"batch": "BT-001", "quality_grade": "A", "production_line": "Line 1"}'
  },
  shipping: {
    action: "shipped",
    location: "Distribution Center",
    metadata: '{"tracking_id": "TRK-123456", "carrier": "GlobalLogistics", "estimated_delivery": "2024-01-20"}'
  },
  delivery: {
    action: "delivered",
    location: "Customer Location",
    metadata: '{"delivery_time": "2024-01-20T14:30:00Z", "received_by": "John Doe", "condition": "Good"}'
  }
};

export default function EventForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      user: "",
      action: "",
      asset_id: "",
      location: "",
      metadata: "",
    },
  });

  const { data: participants } = useQuery({
    queryKey: ['/api/participants'],
    queryFn: api.getParticipants,
  });

  const addEventMutation = useMutation({
    mutationFn: api.addEvent,
    onSuccess: (data) => {
      toast({
        title: "Event Added Successfully",
        description: `Block #${data.block.index} has been added to the blockchain.`,
      });
      form.reset();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chain'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Event",
        description: error.message || "An error occurred while adding the event.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    let parsedMetadata = {};
    
    if (data.metadata) {
      try {
        parsedMetadata = JSON.parse(data.metadata);
      } catch (error) {
        // If JSON parsing fails, treat as key-value pairs
        const pairs = data.metadata.split(',').map(pair => pair.trim().split(':'));
        parsedMetadata = pairs.reduce((acc, [key, value]) => {
          if (key && value) {
            acc[key.trim()] = value.trim();
          }
          return acc;
        }, {} as any);
      }
    }

    // Add location to metadata if provided
    if (data.location) {
      parsedMetadata = { ...parsedMetadata, location: data.location };
    }

    addEventMutation.mutate({
      user: data.user,
      action: data.action,
      asset_id: data.asset_id,
      meta: parsedMetadata,
    });
  };

  const applyTemplate = (templateKey: keyof typeof templates) => {
    const template = templates[templateKey];
    form.setValue("action", template.action);
    form.setValue("location", template.location);
    form.setValue("metadata", template.metadata);
  };

  const clearForm = () => {
    form.reset();
  };

  const participantOptions = participants ? Object.keys(participants) : [];

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
          Add Supply Chain Event
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Record a new event in the blockchain
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participant</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-participant">
                          <SelectValue placeholder="Select participant..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {participantOptions.map((participant) => (
                          <SelectItem key={participant} value={participant}>
                            {participant}
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
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-action">
                          <SelectValue placeholder="Select action..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {actionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset ID</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="PRD-2024-XXX"
                          data-testid="input-asset-id"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        data-testid="button-scan-qr-asset"
                      >
                        <QrCode size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter manually or scan QR code
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Current location"
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Metadata</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder='Enter additional information as JSON or key-value pairs...'
                      data-testid="textarea-metadata"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Example: {`{"batch": "BT-001", "temperature": "2°C", "weight": "1.5kg"}`}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-medium text-secondary dark:text-white mb-2">
                Quick Templates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyTemplate('manufacturing')}
                  className="justify-start"
                  data-testid="button-template-manufacturing"
                >
                  Manufacturing Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyTemplate('shipping')}
                  className="justify-start"
                  data-testid="button-template-shipping"
                >
                  Shipping Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyTemplate('delivery')}
                  className="justify-start"
                  data-testid="button-template-delivery"
                >
                  Delivery Template
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={clearForm}
                data-testid="button-clear-form"
              >
                Clear Form
              </Button>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  data-testid="button-save-draft"
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  disabled={addEventMutation.isPending}
                  className="bg-primary hover:bg-blue-700 text-white"
                  data-testid="button-add-to-blockchain"
                >
                  {addEventMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add to Blockchain
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
