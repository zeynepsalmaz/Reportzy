"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plug, Info } from "lucide-react";

const API_BASE = `http://localhost:8001/api`;

export function APIConnect() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tableName, setTableName] = useState("");
  const [connecting, setConnecting] = useState(false);

  const connectAPI = async () => {
    if (!apiUrl.trim() || !tableName.trim()) {
      alert("Please fill in API URL and table name");
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch(`${API_BASE}/connect-api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: apiUrl.trim(),
          api_key: apiKey.trim(),
          table_name: tableName.trim()
        })
      });

      if (response.ok) {
        await response.json();
        alert("API connected successfully!");
        
        // Clear form
        setApiUrl("");
        setApiKey("");
        setTableName("");
      } else {
        const error = await response.json();
        alert("API connection failed: " + (error.detail || "Unknown error"));
      }
    } catch (error) {
      console.error("Error connecting API:", error);
      alert("Network error occurred");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🔌 API Integration</h2>
        <p className="text-gray-600">Connect external APIs to automatically import data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect External API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <Input
                id="api-url"
                type="url"
                placeholder="https://api.example.com/data"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                disabled={connecting}
              />
            </div>

            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                API Key (Optional)
              </label>
              <Input
                id="api-key"
                type="password"
                placeholder="Your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={connecting}
              />
            </div>

            <div>
              <label htmlFor="table-name" className="block text-sm font-medium text-gray-700 mb-2">
                Table Name
              </label>
              <Input
                id="table-name"
                placeholder="api_data"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                disabled={connecting}
              />
            </div>

            <Button 
              onClick={connectAPI} 
              disabled={connecting || !apiUrl.trim() || !tableName.trim()}
              className="w-full"
            >
              <Plug className="mr-2 h-4 w-4" />
              {connecting ? "Connecting..." : "Connect API"}
            </Button>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Instructions</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Enter the API endpoint URL that returns JSON data</li>
                    <li>• Add API key if authentication is required</li>
                    <li>• Choose a table name for storing the data</li>
                    <li>• The system will automatically fetch and import the data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
