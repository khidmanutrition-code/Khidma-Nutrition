import { useState } from 'react';
import { ArrowLeft, Briefcase, Home, ChevronRight, MoreVertical } from 'lucide-react';
import { DIVISIONS_CITIES } from '../data/products';
import { SavedAddress } from '../types';

interface AddAddressPageProps {
  initialAddress?: SavedAddress | null;
  onBack: () => void;
  onSaveAddress: (address: SavedAddress) => void;
}

export function AddAddressPage({
  initialAddress,
  onBack,
  onSaveAddress,
}: AddAddressPageProps) {
  const divisions = Object.keys(DIVISIONS_CITIES);
  const [fullName, setFullName] = useState(initialAddress?.fullName ?? '');
  const [phone, setPhone] = useState(initialAddress?.phone ?? '');
  const [division, setDivision] = useState(initialAddress?.division ?? divisions[0]);
  const [city, setCity] = useState(initialAddress?.city ?? DIVISIONS_CITIES[divisions[0]][0]);
  const [zone, setZone] = useState(initialAddress?.zone ?? 'উত্তরা / মিরপুর');
  const [address, setAddress] = useState(initialAddress?.address ?? '');
  const [landmark, setLandmark] = useState(initialAddress?.landmark ?? '');
  const [label, setLabel] = useState<'HOME' | 'OFFICE'>(initialAddress?.label ?? 'HOME');
  const [isDefaultShipping, setIsDefaultShipping] = useState(
    initialAddress?.isDefaultShipping ?? true
  );
  const [isDefaultBilling, setIsDefaultBilling] = useState(
    initialAddress?.isDefaultBilling ?? false
  );
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleDivisionChange = (nextDiv: string) => {
    setDivision(nextDiv);
    const nextCities = DIVISIONS_CITIES[nextDiv] ?? ['ঢাকা'];
    setCity(nextCities[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (fullName.trim().length < 2) {
      setErrorBanner('অনুগ্রহ করে আপনার সম্পূর্ণ নাম (Full Name) লিখুন।');
      return;
    }
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorBanner('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 01770241803)।');
      return;
    }
    if (address.trim().length < 5) {
      setErrorBanner('বাসা, রোড ও এলাকার পূর্ণ ঠিকানা (Address) লিখুন।');
      return;
    }

    setErrorBanner(null);
    onSaveAddress({
      id: initialAddress?.id ?? `addr-${Date.now()}`,
      fullName: fullName.trim(),
      phone: cleanPhone,
      division,
      city,
      zone: zone.trim() || city,
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      label,
      isDefaultShipping,
      isDefaultBilling,
    });
  };

  return (
    <div className="min-h-screen site-canvas text-[#081149] flex flex-col pb-20">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white shadow-xs">
        <div className="max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-medium">Add New Address</h1>
          </div>
          <MoreVertical className="w-5 h-5 opacity-90" />
        </div>
      </header>

      {/* Screenshot 6 Dark Error Toast Banner if Validation Fails */}
      {errorBanner && (
        <div className="bg-[#333333]/95 text-white px-4 py-3 text-xs sm:text-sm max-w-[720px] w-full mx-auto">
          <p className="font-bold">Error</p>
          <p className="text-white/90 mt-0.5">{errorBanner}</p>
        </div>
      )}

      {/* Screenshot 4 & 6 Underline Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex-1 max-w-[720px] w-full mx-auto px-4 sm:px-6 py-4 space-y-5"
      >
        <div>
          <label htmlFor="addr-fullname" className="sr-only">
            Full Name
          </label>
          <input
            id="addr-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full py-3.5 border-b border-[#DDDDEF] focus:border-[#663CBC] text-sm text-[#081149] placeholder:text-[#7880A0] focus:outline-none bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="addr-phone" className="sr-only">
            Phone Number
          </label>
          <input
            id="addr-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number (01XXXXXXXXX)"
            className="w-full py-3.5 border-b border-[#DDDDEF] focus:border-[#663CBC] text-sm font-mono text-[#081149] placeholder:text-[#7880A0] focus:outline-none bg-transparent"
          />
        </div>

        <div className="relative border-b border-[#E5E5E5]">
          <label htmlFor="addr-division" className="block text-[11px] text-[#9E9E9E]">
            Province / Region
          </label>
          <div className="flex items-center justify-between">
            <select
              id="addr-division"
              value={division}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full py-2.5 bg-transparent text-sm text-[#212121] focus:outline-none appearance-none cursor-pointer"
            >
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-[#9E9E9E] shrink-0 pointer-events-none" />
          </div>
        </div>

        <div className="relative border-b border-[#E5E5E5]">
          <label htmlFor="addr-city" className="block text-[11px] text-[#9E9E9E]">
            City / District
          </label>
          <div className="flex items-center justify-between">
            <select
              id="addr-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full py-2.5 bg-transparent text-sm text-[#212121] focus:outline-none appearance-none cursor-pointer"
            >
              {(DIVISIONS_CITIES[division] ?? ['ঢাকা']).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-[#9E9E9E] shrink-0 pointer-events-none" />
          </div>
        </div>

        <div className="border-b border-[#E5E5E5]">
          <label htmlFor="addr-zone" className="block text-[11px] text-[#9E9E9E]">
            Zone / Thana
          </label>
          <input
            id="addr-zone"
            type="text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="এলাকা বা থানা লিখুন (যেমন: উত্তরা)"
            className="w-full py-2.5 text-sm text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="addr-line" className="sr-only">
            Address
          </label>
          <input
            id="addr-line"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (বাসা নং, রোড, সেক্টর)"
            className="w-full py-3.5 border-b border-[#DDDDEF] focus:border-[#663CBC] text-sm text-[#081149] placeholder:text-[#7880A0] focus:outline-none bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="addr-landmark" className="sr-only">
            Landmark (Optional)
          </label>
          <input
            id="addr-landmark"
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Landmark (Optional)"
            className="w-full py-3.5 border-b border-[#DDDDEF] focus:border-[#663CBC] text-sm text-[#081149] placeholder:text-[#7880A0] focus:outline-none bg-transparent"
          />
        </div>

        {/* OFFICE / HOME Delivery Label Buttons */}
        <div className="pt-2 space-y-2.5">
          <p className="text-sm text-[#5E6484]">Select a label for effective delivery:</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLabel('OFFICE')}
              className={`px-5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                label === 'OFFICE'
                  ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC]'
                  : 'border-[#DDDDEF] bg-white text-[#3C4266]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>OFFICE</span>
            </button>

            <button
              type="button"
              onClick={() => setLabel('HOME')}
              className={`px-5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                label === 'HOME'
                  ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC]'
                  : 'border-[#DDDDEF] bg-white text-[#3C4266]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>HOME</span>
            </button>
          </div>
        </div>

        {/* Default Shipping & Billing Toggles */}
        <div className="pt-2 divide-y divide-[#E7EDFF] border-t border-[#E7EDFF]">
          <div className="py-3.5 flex items-center justify-between">
            <span className="text-sm text-[#081149]">Make default shipping address</span>
            <button
              type="button"
              role="switch"
              aria-checked={isDefaultShipping}
              onClick={() => setIsDefaultShipping((v) => !v)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                isDefaultShipping ? 'bg-[#663CBC]' : 'bg-[#CBD5E1]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isDefaultShipping ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <span className="text-sm text-[#081149]">Make default billing address</span>
            <button
              type="button"
              role="switch"
              aria-checked={isDefaultBilling}
              onClick={() => setIsDefaultBilling((v) => !v)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                isDefaultBilling ? 'bg-[#663CBC]' : 'bg-[#CBD5E1]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isDefaultBilling ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Bottom Sticky Royal Violet SAVE Button */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#DDDDEF]">
          <div className="max-w-[720px] mx-auto p-2">
            <button
              type="submit"
              className="w-full h-11 rounded-xl ot-gradient-btn text-white text-sm font-bold tracking-wide cursor-pointer"
            >
              SAVE ADDRESS
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
