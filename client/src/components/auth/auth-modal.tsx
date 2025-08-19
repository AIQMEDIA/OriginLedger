import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, X } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ 
    username: "", 
    password: "", 
    email: "",
    role: "manufacturer" 
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response;
      
      if (mode === "login") {
        response = await apiClient.login(form.username, form.password);
      } else {
        if (!form.email) {
          throw new Error("Email is required for registration");
        }
        response = await apiClient.register(form.username, form.password, form.role, form.email);
      }
      
      onSuccess(response.token, response.user);
      onClose();
      
      // Reset form
      setForm({ username: "", password: "", email: "", role: "manufacturer" });
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === "login" ? "signup" : "login");
    setError(null);
    setForm({ username: "", password: "", email: "", role: "manufacturer" });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-6 w-full max-w-md border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === "login" ? "Sign In" : "Create Account"}
            </Dialog.Title>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                required
                data-testid="input-username"
                className="w-full"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  data-testid="input-email"
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
                data-testid="input-password"
                className="w-full"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={form.role} onValueChange={(value) => handleChange("role", value)}>
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="shipper">Shipper</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription data-testid="error-message">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-submit"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading 
                ? "Processing..." 
                : (mode === "login" ? "Sign In" : "Create Account")
              }
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <Button 
              variant="link" 
              onClick={toggleMode}
              className="p-0 h-auto text-blue-600 hover:text-blue-500"
              data-testid="button-toggle-mode"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}