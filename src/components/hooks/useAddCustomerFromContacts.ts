
import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// Passes right through to onAdd, and now expects onAdd to insert into Supabase
type AddCustomerFn = (name: string, phone: string) => void | Promise<void>;

export function useAddCustomerFromContacts(onAdd: AddCustomerFn) {
  // Only use browser contacts picker; if unavailable, show error
  const addFromContacts = useCallback(async () => {
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        // @ts-ignore
        const contacts = await (navigator as any).contacts.select(["name", "tel"], { multiple: false });
        if (contacts && contacts.length > 0) {
          const selected = contacts[0];
          const name = Array.isArray(selected.name) ? selected.name[0] : selected.name ?? "Unknown";
          const phone = Array.isArray(selected.tel) ? selected.tel[0] : selected.tel ?? "";
          await onAdd(name, phone);
          toast({ title: "Added from contacts", description: `Imported ${name}.` });
          return;
        }
        toast({ title: "No contact selected", description: "No contact was added.", variant: "destructive" });
      } catch (_e: any) {
        toast({ title: "Permission denied", description: "Contact access was denied.", variant: "destructive" });
      }
      return;
    }
    toast({
      title: "Contacts API not supported",
      description: "This device cannot import contacts directly.",
      variant: "default"
    });
  }, [onAdd]);

  return addFromContacts;
}
