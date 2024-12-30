'use client'

interface HeaderProps {
  text: string;
}

export function Header({ text }: HeaderProps) {
  return (
    <header className="bg-[#1DA6E0] py-6 px-4">
      <div className="container mx-auto">
        <h1 className="text-white text-center text-lg font-medium">
          {text}
        </h1>
      </div>
    </header>
  );
}
