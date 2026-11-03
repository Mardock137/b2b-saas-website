import { ShieldX } from "lucide-react";

export default function BlockedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <ShieldX className="h-6 w-6" />
      </div>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Service Not Available
      </h1>
    </div>
  );
}
