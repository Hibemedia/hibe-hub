import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  test: string;
  description: string;
  url: string;
  status: number | string;
  ok?: boolean;
  dataCount?: number;
  sampleData?: any[];
  processedSample?: any[];
  headers?: Record<string, string>;
  error?: string;
}

interface DebugResponse {
  success: boolean;
  brandId: number;
  dateRange: {
    from: string;
    to: string;
  };
  userId: string;
  tests: TestResult[];
  mergeExample?: any;
  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    totalPostsFound: number;
  };
}

export default function MetricoolDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DebugResponse | null>(null);
  const [openTests, setOpenTests] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const runDebugTests = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('metricool-debug-posts', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setResults(data);
      toast({
        title: "Debug tests completed",
        description: `Found ${data.summary.totalPostsFound} posts across ${data.summary.successfulTests} successful API calls`,
      });
    } catch (error) {
      console.error('Debug test error:', error);
      toast({
        title: "Debug test failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTest = (testName: string) => {
    const newOpen = new Set(openTests);
    if (newOpen.has(testName)) {
      newOpen.delete(testName);
    } else {
      newOpen.add(testName);
    }
    setOpenTests(newOpen);
  };

  const getStatusIcon = (test: TestResult) => {
    if (test.ok) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (test.status === 'NETWORK_ERROR') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (test: TestResult) => {
    if (test.ok) {
      return <Badge variant="outline" className="text-green-600 border-green-200">Success</Badge>;
    } else if (test.status === 'NETWORK_ERROR') {
      return <Badge variant="destructive">Network Error</Badge>;
    } else {
      return <Badge variant="destructive">HTTP {test.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metricool API Debug</h1>
          <p className="text-muted-foreground">
            Test en debug de Metricool API endpoints om te zien welke data wordt opgehaald
          </p>
        </div>
        <Button 
          onClick={runDebugTests}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isLoading ? 'Running Tests...' : 'Run Debug Tests'}
        </Button>
      </div>

      {results && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.summary.totalTests}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.summary.successfulTests}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{results.summary.failedTests}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{results.summary.totalPostsFound}</div>
                  <div className="text-sm text-muted-foreground">Posts Found</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div><strong>Brand ID:</strong> {results.brandId} (my Goodbye)</div>
                  <div><strong>User ID:</strong> {results.userId}</div>
                  <div><strong>Date Range:</strong> {results.dateRange.from} to {results.dateRange.to}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <div className="space-y-4">
            {results.tests.map((test, index) => (
              <Card key={index}>
                <Collapsible 
                  open={openTests.has(test.test)}
                  onOpenChange={() => toggleTest(test.test)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test)}
                          <div>
                            <CardTitle className="text-lg">{test.test}</CardTitle>
                            <p className="text-sm text-muted-foreground">{test.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(test)}
                          {test.dataCount !== undefined && (
                            <Badge variant="secondary">{test.dataCount} posts</Badge>
                          )}
                          {openTests.has(test.test) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* URL */}
                        <div>
                          <h4 className="font-semibold mb-2">API URL:</h4>
                          <code className="text-xs bg-muted p-2 rounded block break-all">
                            {test.url}
                          </code>
                        </div>

                        {/* Error */}
                        {test.error && (
                          <div>
                            <h4 className="font-semibold mb-2 text-red-600">Error:</h4>
                            <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                              {test.error}
                            </div>
                          </div>
                        )}

                        {/* Sample Data */}
                        {test.sampleData && test.sampleData.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Raw Response Sample:</h4>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                              {JSON.stringify(test.sampleData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Processed Data */}
                        {test.processedSample && test.processedSample.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Processed Data (What We Would Save):</h4>
                            <pre className="text-xs bg-blue-50 border border-blue-200 p-3 rounded overflow-auto max-h-64">
                              {JSON.stringify(test.processedSample, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Headers */}
                        {test.headers && (
                          <div>
                            <h4 className="font-semibold mb-2">Response Headers:</h4>
                            <div className="text-xs bg-muted p-3 rounded">
                              {Object.entries(test.headers).map(([key, value]) => (
                                <div key={key}>
                                  <strong>{key}:</strong> {value}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>

          {/* Merge Example */}
          {results.mergeExample && (
            <Card>
              <CardHeader>
                <CardTitle>Data Merge Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Dit laat zien hoe we de basis post data zouden combineren met platform-specifieke details:
                  </p>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Merge Strategy:</h4>
                    <p className="text-sm bg-muted p-2 rounded">{results.mergeExample.mergeStrategy}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Final Post Object (wat opgeslagen zou worden):</h4>
                    <pre className="text-xs bg-green-50 border border-green-200 p-3 rounded overflow-auto">
                      {JSON.stringify(results.mergeExample.finalPostObject, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}