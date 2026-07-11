import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Camera } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateMe, useUploadAvatar, deleteAvatar, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  avatarUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
});

export default function Profile() {
  const token = localStorage.getItem("token");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const uploadedAvatarUrlRef = useRef<string | null>(null);
  const avatarSavedRef = useRef(false);

  const uploadAvatarMutation = useUploadAvatar();

  async function handleAvatarUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      // Delete previously uploaded avatar if it hasn't been saved yet
      if (
        uploadedAvatarUrlRef.current &&
        !avatarSavedRef.current
      ) {
        try {
          await deleteAvatar({
            url: uploadedAvatarUrlRef.current,
          });
        } catch (err) {
          console.error("Failed to delete previous avatar:", err);
        }

        uploadedAvatarUrlRef.current = null;
      }

      const data = await uploadAvatarMutation.mutateAsync({
        data: {
          file,
        },
      });

      form.setValue("avatarUrl", data.url, {
        shouldValidate: true,
        shouldDirty: true,
      });

      uploadedAvatarUrlRef.current = data.url;
      avatarSavedRef.current = false;
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      e.target.value = "";
    }
  }

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      avatarUrl: "",
    },
  });

  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    if (user && initializedRef.current !== user.id) {
      initializedRef.current = user.id;
      form.reset({
        name: user.name,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, form]);

  useEffect(() => {
    return () => {
      const uploadedUrl = uploadedAvatarUrlRef.current;

      if (uploadedUrl && !avatarSavedRef.current) {
        void deleteAvatar({
          url: uploadedUrl,
        }).catch(console.error);
      }
    };
  }, []);

  const updateMutation = useUpdateMe();

  function onSubmit(values: z.infer<typeof profileSchema>) {
    // Clean up empty strings to undefined to match API expectations if needed,
    // though the generated API accepts string | null.
    const payload = {
      name: values.name,
      bio: values.bio || undefined,
      avatarUrl: values.avatarUrl || undefined,
    };

    updateMutation.mutate(
      { data: payload },
      {
        onSuccess: (updatedUser) => {
          avatarSavedRef.current = true;
          uploadedAvatarUrlRef.current = null;
          // Update cache directly to avoid flash
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);

          form.reset({
            name: updatedUser.name,
            bio: updatedUser.bio ?? "",
            avatarUrl: updatedUser.avatarUrl ?? "",
          });

          toast({
            title: "Profile updated",
            description: "Your changes have been saved successfully.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Update failed",
            description: error?.error || "Could not update profile.",
            variant: "destructive",
          });
        },
      }
    );
  }

  // Watch avatar URL to show preview
  const avatarUrl = form.watch("avatarUrl");
  const name = form.watch("name");

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and preferences.</p>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/30 border-b border-border/50">
          <CardTitle>Public Information</CardTitle>
          <CardDescription>
            This information will be displayed publicly to other users.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-32 h-32 border border-border shadow-sm">
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                  {name ? name.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Camera className="w-3 h-3" /> Avatar Preview
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg">{user.email}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your email address is managed by your administrator and cannot be changed here.
              </p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                Role: <span className="capitalize ml-1">{user.role}</span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="max-w-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Avatar</FormLabel>

                    <FormControl>
                      <Input
                        type="hidden"
                        placeholder="https://example.com/avatar.jpg"
                        {...field}
                        value={field.value || ""}
                        className="max-w-md font-mono text-sm"
                      />
                    </FormControl>

                    <div className="mt-3 max-w-md space-y-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Choose File
                          </>
                        )}
                      </Button>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little bit about yourself..."
                        className="resize-none min-h-[120px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum 500 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                  className="min-w-[120px]"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
