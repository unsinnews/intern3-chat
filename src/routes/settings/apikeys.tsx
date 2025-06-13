import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Provider } from "@/convex/schema/apikey";

export const Route = createFileRoute("/settings/apikeys")({
  component: ApiKeysSettings,
});

const PROVIDERS: Provider[] = ["openai", "anthropic", "google"];

function ApiKeysSettings() {
  const [newKey, setNewKey] = useState<{ provider: Provider; key: string }>({
    provider: "openai",
    key: "",
  });
  const [addingKey, setAddingKey] = useState(false);

  const apiKeys = useQuery(api.apikeys.listApiKeys) ?? [];
  const storeApiKey = useMutation(api.apikeys.storeApiKey);
  const deleteApiKey = useMutation(api.apikeys.deleteApiKey);

  const handleAddKey = async () => {
    if (!newKey.key) return;
    await storeApiKey({
      provider: newKey.provider,
      apiKey: newKey.key,
    });
    setNewKey({ provider: "openai", key: "" });
    setAddingKey(false);
  };

  const handleDeleteKey = async (keyId: Id<"apiKeys">) => {
    await deleteApiKey({ keyId });
  };

  return (
    <SettingsLayout
      title="Model Providers"
      description="Add your own API keys to unlock access to models. Your keys are stored securely with end-to-end encryption."
    >
      <div className="space-y-6">
        {PROVIDERS.map((provider) => {
          const key = apiKeys.find(
            (k) => k.provider === provider
          );

          return (
            <div
              key={provider}
              className={cn(
                "flex flex-col gap-4 p-6",
                "border rounded-lg bg-card",
                "transition-colors duration-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium capitalize">{provider}</h3>
                  {key && (
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {key ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    Delete
                  </Button>
                ) : addingKey && newKey.provider === provider ? (
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={newKey.key}
                      onChange={(e) =>
                        setNewKey((prev) => ({ ...prev, key: e.target.value }))
                      }
                      placeholder={`Enter ${provider} API key`}
                      className="w-[300px]"
                    />
                    <Button onClick={handleAddKey}>Save</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAddingKey(false);
                        setNewKey({ provider: "openai", key: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddingKey(true);
                      setNewKey({ provider, key: "" });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SettingsLayout>
  );
} 