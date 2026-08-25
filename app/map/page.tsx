"use client";

import AppHeader from "@/components/AppHeader";
import FirozabadMap from "@/components/FirozabadMap";
import NeedLogin from "@/components/NeedLogin";

export default function MapPage() {
  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() => (
          <main className="kn-shell mx-auto max-w-lg px-5 pb-16 pt-8">
            <h1 className="text-4xl font-extrabold leading-tight">नक्शा / Map</h1>
            <p className="mt-3 text-lg text-[#5c4638]">
              लोग आपके पास पहले। स्पेक मैच फिर भी पहले।
            </p>
            <p className="mt-1 text-lg text-[#5c4638]">
              People near you first. Spec match still comes first.
            </p>
            <div className="mt-8">
              <FirozabadMap />
            </div>
          </main>
        )}
      </NeedLogin>
    </>
  );
}
