import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OverrideConfigDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="text-blue-500 hover:text-blue-600 h-auto p-0">
                    Override Config Format
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1000px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Override Config Documentation</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
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
                            <pre className="bg-muted p-4 rounded-md mt-2">
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
                            <ScrollArea className="h-[575px] rounded-md border p-4">
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
    "overrideConfig": `}
                                </pre>
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-md px-4 py-2 my-2">
                                    <pre className="text-sm">
{`{
    "sessionId": "example",
    "memoryKey": "example", 
    "systemMessage": "example", 
    "maxIterations": 1
}`}
                                    </pre>
                                </div>
                                <pre className="text-sm">
                                    {`    }).then((response) => {
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
            </DialogContent>
        </Dialog>
    );
} 