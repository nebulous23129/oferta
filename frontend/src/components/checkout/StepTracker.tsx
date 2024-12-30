interface StepTrackerProps {
  currentStep: number;
  isDigitalProduct: boolean;
}

export default function StepTracker({ currentStep, isDigitalProduct }: StepTrackerProps) {
  const steps = isDigitalProduct
    ? [
        { number: 1, label: 'Informações Pessoais' },
        { number: 2, label: 'Pagamento' }
      ]
    : [
        { number: 1, label: 'Informações Pessoais' },
        { number: 2, label: 'Entrega' },
        { number: 3, label: 'Pagamento' }
      ];

  return (
    <div className="hidden w-full py-4">
      <div className="flex justify-between items-center relative">
        {/* Linha de conexão */}
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-gray-200" />
        <div
          className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-green-500 transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
          }}
        />

        {/* Steps */}
        {steps.map((step) => (
          <div
            key={step.number}
            className="relative flex flex-col items-center z-10"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                currentStep >= step.number
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step.number}
            </div>
            <span
              className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                currentStep >= step.number ? 'text-green-500' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
