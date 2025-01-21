"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function OverrideConfigDocs() {

    const router = useRouter();

    return (
        <div className="container mx-auto p-4">
            <div>
                <Button variant={'outline'} onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            </div>
            <h1 className="text-4xl font-bold mb-6">Override Config Documentation</h1>

            <Card className="mb-6" id="introduction">
                <CardHeader>
                    <CardTitle>Introduction</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        The override config feature allows you to dynamically modify the behavior of your API calls without changing
                        the underlying code. This is particularly useful for testing different configurations or for providing
                        user-specific settings.
                    </p>
                </CardContent>
            </Card>

            <Card className="mb-6" id="format">
                <CardHeader>
                    <CardTitle>Override Config Format</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        The override config should be provided as a JSON object within your API request. Here's the basic structure:
                    </p>
                    <pre className="bg-gray-100 p-4 rounded-md mt-2">
                        {`{
    "key1": "value1",
    "key2": "value2",
    ...
}`}
                    </pre>
                </CardContent>
            </Card>

            <Card className="mb-6" id="usage">
                <CardHeader>
                    <CardTitle>Usage Example</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Here's an example of how to use the override config in a JavaScript API call:</p>
                    <ScrollArea className="h-[555x] rounded-md border p-4">
                        <pre className="text-sm">
                            {`async function query(data) {
    const response = await fetch(
        "https://flowise.ibrcloud.com/api/v1/prediction/e8e55f9f-a72b-4282-be71-ede0ad8f76b5",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}

query({
  "question": "Hey, how are you?",
  "overrideConfig":`}
                        </pre>
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                            <pre className="text-sm">
                                {`      {
            "sessionId": "example",
            "memoryKey": "example", 
            "systemMessage": "example", 
            "maxIterations": 1,
        }`}
                            </pre>
                        </div>
                        <pre className="text-sm">
                            {`}).then((response) => {
    console.log(response);
});`}
                        </pre>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Conclusion</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        The override config feature provides a flexible way to customize your API calls. By understanding and
                        utilizing this feature, you can create more dynamic and adaptable applications.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

