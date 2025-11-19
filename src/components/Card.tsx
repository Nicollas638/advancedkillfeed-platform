export default function SectionHeading({
                                           title,
                                           action
                                       }: {
    title: string;
    action?: React.ReactNode;
}) {
    return (
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
      <span className="flex items-center">
        <span className="w-1.5 h-5 bg-rose-500 rounded-full mr-2"/>
          {title}
      </span>
            {action && action}
        </h2>
    );
}