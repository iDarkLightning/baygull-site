import { useState, useEffect } from "react";

export const ClientOnly: React.FC<React.PropsWithChildren> = (props) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <>{isClient ? props.children : null}</>;
};
