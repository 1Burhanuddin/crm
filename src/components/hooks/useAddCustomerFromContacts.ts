import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// Passes right through to onAdd, and now expects onAdd to insert into Supabase
type AddCustomerFn = (name: string, phone: string) => void | Promise<void>;

export function useAddCustomerFromContacts(onAdd: AddCustomerFn) {
  const addFromContacts = useCallback(async () => {
    // Modern way to check for Contact Picker API support
    if ('contacts' in navigator) {
      try {
        // @ts-ignore - TypeScript doesn't know about the contacts API yet
        const contacts = await navigator.contacts.select(['name', 'tel'], {
          multiple: false
        });

        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const name = Array.isArray(contact.name) ? contact.name[0] : contact.name;
          const phone = Array.isArray(contact.tel) ? contact.tel[0] : contact.tel;

          if (!name) {
            toast({
              title: "Invalid contact",
              description: "Selected contact must have a name.",
              variant: "destructive"
            });
            return;
          }

          await onAdd(name, phone || "");
          toast({
            title: "Success",
            description: `Added ${name} to customers.`
          });
        } else {
          toast({
            title: "No contact selected",
            description: "Please select a contact to add.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Contact Picker error:', error);
        if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
          toast({
            title: "Permission denied",
            description: "Please allow access to contacts to use this feature.",
            variant: "destructive"
          });
        } else if (error.name === 'InvalidStateError') {
          toast({
            title: "Not available",
            description: "Contact picker is not available at this moment.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to access contacts. Please try again.",
            variant: "destructive"
          });
        }
      }
    } else {
      // If Contact Picker API is not supported
      toast({
        title: "Not supported",
        description: "Contact picker is not supported on this device. Please add customer manually.",
        variant: "destructive"
      });
    }
  }, [onAdd]);

  return addFromContacts;
}
