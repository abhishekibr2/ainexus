export type Message = {
  message: string;
}

export function FormMessage({ message, action }: { message: Message, action: string }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {action === "success" && (
        <div className="text-foreground border-l-2 border-foreground px-4">
          {message.message}
        </div>
      )}
      {action === "error" && (
        <div className="text-destructive border-l-2 border-destructive px-4">
          {message.message}
        </div>
      )}
      {action === "message" && (
        <div className="text-foreground border-l-2 px-4">{message.message}</div>
      )}
    </div>
  );
}
