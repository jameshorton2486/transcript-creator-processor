
/**
 * Component displayed when no entities are available
 */

export const EmptyEntityState = () => {
  return (
    <div className="p-6 text-center text-slate-500 h-full flex items-center justify-center">
      <div>
        <h3 className="text-lg font-medium">No entities were found in this transcript</h3>
        <p className="mt-2">Process a transcript with entity extraction enabled to see results</p>
      </div>
    </div>
  );
};
