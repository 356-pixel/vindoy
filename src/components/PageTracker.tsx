import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

export default function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!analytics) return;
    const path = location.pathname + location.search;
    logEvent(analytics, "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);

  return null;
}
