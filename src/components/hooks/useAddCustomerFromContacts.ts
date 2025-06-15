
import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

type AddCustomerFn = (name: string, phone: string) => void;

export function useAddCustomerFromContacts(onAdd: AddCustomerFn) {
  // For browsers with the Contacts API, this enables picking contacts
  const addFromContacts = useCallback(async () => {
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        // @ts-ignore
        const contacts = await (navigator as any).contacts.select(["name", "tel"], { multiple: false });
        if (contacts && contacts.length > 0) {
          const selected = contacts[0];
          const name = Array.isArray(selected.name) ? selected.name[0] : selected.name ?? "Unknown";
          const phone = Array.isArray(selected.tel) ? selected.tel[0] : selected.tel ?? "";
          onAdd(name, phone);
          toast({ title: "Added from contacts", description: `Imported ${name}.` });
          return;
        }
        toast({ title: "No contact selected", description: "No contact was added.", variant: "destructive" });
      } catch (e: any) {
        toast({ title: "Permission denied", description: "Contact access was denied. Adding dummy customer.", variant: "destructive" });
        // FALLBACK to dummy
        addDummy();
      }
      return;
    }
    // Contacts API not supported
    toast({ title: "Contacts API not supported", description: "Adding dummy customer for demonstration.", variant: "info" });
    addDummy();

    function addDummy() {
      const fakeNames = [
        ["Ananya Singh", "+919876543210"],
        ["Dev Sharma", "+919912345678"],
        ["Priya Patel", "+919712345890"],
        ["Vikram Rao", "+918756341209"]
      ];
      const [name, phone] = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      onAdd(name, phone);
    }
  }, [onAdd]);

  return addFromContacts;
}
