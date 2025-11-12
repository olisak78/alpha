import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, Database } from "lucide-react";
import { toast } from "sonner";
const exampleQueries = [{
  schema: "accounts_service",
  text: "How many subaccounts were created monthly in 2025?"
}, {
  schema: "accounts_service",
  text: "What is the average number of subaccounts per global account?"
}, {
  schema: "entitlements_service",
  text: "What are the most used service plans?"
}, {
  schema: "accounts_service",
  text: "Show top 3 regions of subaccounts"
}];
const schemas = [{
  value: "accounts_service",
  label: "accounts_service"
}, {
  value: "entitlements_service",
  label: "entitlements_service"
}, {
  value: "notification_service",
  label: "notification_service"
}, {
  value: "order_service",
  label: "order_service"
}, {
  value: "payment_service",
  label: "payment_service"
}, {
  value: "user_service",
  label: "user_service"
}];
const AskOCTab: React.FC = () => {
  const [schema, setSchema] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [charts, setCharts] = useState<boolean>(false);
  const handleSubmit = () => {
    if (!schema || !query.trim()) {
      toast("Please select a schema and enter a question.");
      return;
    }
    toast.success("Query submitted", {
      description: `${schema}: ${query}`
    });
  };
  const handleUseExample = (s: string, q: string) => {
    setSchema(s);
    setQuery(q);
  };
  return <div className="space-y-8">
      <header className="mt-6 md:mt-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Database className="h-5 w-5" aria-hidden />
          <h2 className="text-xl font-semibold">AskOC</h2>
        </div>
        <p className="text-sm text-muted-foreground">Ask questions about your data in natural language</p>
      </header>

      <section>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="relative rounded-xl border p-3 md:p-4">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-4">
                  <Select value={schema || undefined} onValueChange={setSchema}>
                    <SelectTrigger className="w-full" aria-label="Select Database Schema">
                      <SelectValue placeholder="Select Database Schema" />
                    </SelectTrigger>
                    <SelectContent>
                      {schemas.map(s => <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>

                  <div className="relative bg-transparent">
                    <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="What is the percentage of automation requests with status APPLY_FAILED, last month?" aria-label="Ask a question" onKeyDown={e => {
                    if (e.key === "Enter") handleSubmit();
                  }} className="pr-12 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
                    <Button type="button" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full" onClick={handleSubmit} aria-label="Submit query">
                      <ArrowUpCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch id="charts" checked={charts} onCheckedChange={setCharts} />
                    <Label htmlFor="charts">Charts & Visuals</Label>
                  </div>
                  {schema && <Badge variant="outline">{schema}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Try these examples:</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exampleQueries.map((ex, idx) => <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleUseExample(ex.schema, ex.text)}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{ex.schema}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">{ex.text}</p>
              </CardContent>
            </Card>)}
        </div>
      </section>
    </div>;
};
export default AskOCTab;