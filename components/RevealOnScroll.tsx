import React, { useEffect, useRef, useState } from 'react';

interface RevealOnScrollProps {
    children: React.ReactNode;
    animation?: 'fade-up' | 'slide-right' | 'zoom-in';
    delay?: number;
    className?: string;
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({ 
    children, 
    animation = 'fade-up', 
    delay = 0,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1, // Trigger slightly earlier
                rootMargin: '50px' 
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    // Define Start (Hidden) and End (Visible) states using Utility Classes
    // We use transition-all to smoothly animate between them.
    const getTransitionClasses = () => {
        const base = "transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)"; // Smooth ease-out
        
        if (!isVisible) {
            switch (animation) {
                case 'zoom-in': return `${base} opacity-0 scale-95`;
                case 'slide-right': return `${base} opacity-0 -translate-x-8`;
                default: return `${base} opacity-0 translate-y-12`; // fade-up
            }
        }
        
        // Visible State
        switch (animation) {
            case 'zoom-in': return `${base} opacity-100 scale-100`;
            case 'slide-right': return `${base} opacity-100 translate-x-0`;
            default: return `${base} opacity-100 translate-y-0`; // fade-up
        }
    };

    return (
        <div 
            ref={ref} 
            className={`${getTransitionClasses()} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

export default RevealOnScroll;