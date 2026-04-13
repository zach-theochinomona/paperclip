import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, FileText, Brain, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryFile {
  name: string;
  content: string;
  size: number;
  modified?: string;
}

interface MemoryViewerProps {
  agentSlug: string;
  agentName: string;
  cabinetEndpoint?: string;
}

export function MemoryViewer({ agentSlug, agentName, cabinetEndpoint = "http://localhost:3000" }: MemoryViewerProps) {
  const [activeTab, setActiveTab] = useState("context");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query for memory files
  const { data: memoryData, isLoading, error, refetch } = useQuery({
    queryKey: ["agent-memory", agentSlug, cabinetEndpoint],
    queryFn: async () => {
      const files = ["context.md", "decisions.md", "learnings.md"];
      const results: Record<string, MemoryFile> = {};

      for (const file of files) {
        try {
          const res = await fetch(
            `${cabinetEndpoint}/api/memory/${encodeURIComponent(agentSlug)}/${encodeURIComponent(file)}`
          );
          if (res.ok) {
            const data = await res.json();
            results[file.replace(".md", "")] = {
              name: file,
              content: data.content || "",
              size: data.size || 0,
              modified: data.modified,
            };
          }
        } catch (err) {
          console.error(`Failed to fetch ${file}:`, err);
        }
      }

      return results;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getFileIcon = (file: string) => {
    switch (file) {
      case "context":
        return <FileText className="h-4 w-4" />;
      case "decisions":
        return <Brain className="h-4 w-4" />;
      case "learnings":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getFileDescription = (file: string) => {
    switch (file) {
      case "context":
        return "Recent context entries and activity";
      case "decisions":
        return "Key decisions with reasoning";
      case "learnings":
        return "Long-term insights and knowledge";
      default:
        return "Memory file";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Agent Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Agent Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load memory: {error.message}</span>
          </div>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const memoryFiles = memoryData || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Agent Memory
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Memory for {agentName} ({agentSlug})
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="context" className="flex items-center gap-2">
              {getFileIcon("context")}
              Context
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2">
              {getFileIcon("decisions")}
              Decisions
            </TabsTrigger>
            <TabsTrigger value="learnings" className="flex items-center gap-2">
              {getFileIcon("learnings")}
              Learnings
            </TabsTrigger>
          </TabsList>

          {Object.entries(memoryFiles).map(([fileKey, fileData]) => (
            <TabsContent key={fileKey} value={fileKey} className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{fileData.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getFileDescription(fileKey)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {fileData.size} bytes
                    </Badge>
                    {fileData.modified && (
                      <Badge variant="secondary">
                        {new Date(fileData.modified).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-muted/50 max-h-96 overflow-y-auto">
                  {fileData.content ? (
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {fileData.content}
                    </pre>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No {fileKey} entries yet</p>
                      <p className="text-xs">Memory will appear here as the agent works</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Memory Stats */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-2">Memory Statistics</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(memoryFiles).map(([fileKey, fileData]) => (
              <div key={fileKey} className="text-center">
                <div className="text-2xl font-bold">{fileData.size}</div>
                <div className="text-xs text-muted-foreground">
                  {fileKey} bytes
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
