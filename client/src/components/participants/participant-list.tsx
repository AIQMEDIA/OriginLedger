import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Factory, Truck, Store, User, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { z } from "zod";

interface Participant {
  id: string;
  username: string;
  role: string;
  status: string;
  eventCount: number;
  createdAt: string;
}

interface ParticipantListProps {
  participants: Participant[];
  isLoading?: boolean;
}

const participantFormSchema = z.object({
  user: z.string().min(1, "Username is required"),
  role: z.string().min(1, "Role is required"),
});

type ParticipantFormData = z.infer<typeof participantFormSchema>;

const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case 'manufacturer':
      return Factory;
    case 'shipper':
      return Truck;
    case 'retailer':
      return Store;
    default:
      return User;
  }
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'manufacturer':
      return 'role-manufacturer';
    case 'shipper':
      return 'role-shipper';
    case 'retailer':
      return 'role-retailer';
    default:
      return 'role-other';
  }
};

export default function ParticipantList({ participants, isLoading }: ParticipantListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      user: "",
      role: "",
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (data) => {
      toast({
        title: "Participant Added Successfully",
        description: `${data.participant.username} has been registered as ${data.participant.role}.`,
      });
      setIsDialogOpen(false);
      form.reset();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/participants-list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/participants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/participant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Participant",
        description: error.message || "An error occurred while adding the participant.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ParticipantFormData) => {
    addParticipantMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            Participants
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage supply chain participants
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
              Participants
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage supply chain participants
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-blue-700 text-white"
                data-testid="button-add-participant"
              >
                <Plus size={16} className="mr-2" />
                Add Participant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Participant</DialogTitle>
                <DialogDescription>
                  Register a new participant in the supply chain network.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter username"
                            data-testid="input-participant-username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-participant-role">
                              <SelectValue placeholder="Select role..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="shipper">Shipper</SelectItem>
                            <SelectItem value="retailer">Retailer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-participant"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addParticipantMutation.isPending}
                      className="bg-primary hover:bg-blue-700 text-white"
                      data-testid="button-save-participant"
                    >
                      {addParticipantMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        'Add Participant'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {participants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No participants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Events
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {participants.map((participant) => {
                  const Icon = getRoleIcon(participant.role);
                  const roleColor = getRoleColor(participant.role);
                  
                  return (
                    <tr 
                      key={participant.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      data-testid={`participant-row-${participant.username}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${getRoleIcon(participant.role) === Factory ? 'bg-blue-100 dark:bg-blue-900' : getRoleIcon(participant.role) === Truck ? 'bg-green-100 dark:bg-green-900' : 'bg-purple-100 dark:bg-purple-900'} rounded-full flex items-center justify-center`}>
                            <Icon 
                              size={20} 
                              className={getRoleIcon(participant.role) === Factory ? 'text-primary' : getRoleIcon(participant.role) === Truck ? 'text-accent' : 'text-purple-600'} 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary dark:text-white">
                              {participant.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {participant.username}@example.com
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${roleColor} capitalize`}>
                          {participant.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {participant.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {participant.eventCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {participant.createdAt 
                          ? formatDistanceToNow(new Date(participant.createdAt), { addSuffix: true })
                          : 'Unknown'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button 
                          variant="link" 
                          className="text-primary hover:text-blue-700 p-0"
                          data-testid={`button-edit-${participant.username}`}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="link" 
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-0"
                          data-testid={`button-view-events-${participant.username}`}
                        >
                          View Events
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
