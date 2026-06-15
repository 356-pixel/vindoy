import { useEffect, useRef } from "react";

export default function AdsterraBanner(): JSX.Element {
  const banner = useRef<HTMLDivElement>(null);

  const atOptions = {
    key: "b347fb59368f47bd8ea58aacb4505d1b",
    format: "iframe",
    height: 50,
    width: 320,
    params: {},
  };

  useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
      const conf = document.createElement("script");
      conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://www.highperformanceformat.com/${atOptions.key}/invoke.js`;
      script.async = true;

      banner.current.appendChild(conf);
      banner.current.appendChild(script);
    }
  }, []);

  return (
    <div
      ref={banner}
      className="sticky bottom-0 z-50 w-full flex justify-center items-center py-2 bg-background border-t border-border"
    ></div>
  );
}
