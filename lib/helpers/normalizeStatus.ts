export function normalizeStatus(status?: string | null) {
    switch (status) {
      case "reviewing":
      case "shortlisted":
      case "accepted":
      case "rejected":
        return status;
  
      default:
        return "pending";
    }
  }