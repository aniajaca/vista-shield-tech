import { useState } from 'react';
import { UploadInterface } from '@/components/UploadInterface';
import { ResultsView } from '@/components/ResultsView';

const Index = () => {
  const [showResults, setShowResults] = useState(false);

  const handleScanComplete = () => {
    setShowResults(true);
  };

  const handleScanAnother = () => {
    setShowResults(false);
  };

  return (
    <>
      {showResults ? (
        <ResultsView onScanAnother={handleScanAnother} />
      ) : (
        <UploadInterface onScanComplete={handleScanComplete} />
      )}
    </>
  );
};

export default Index;
