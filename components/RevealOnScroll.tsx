
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
                threshold: 0.15, // Trigger when 15% visible for smoother reveal
                rootMargin: '20px' 
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    const getAnimationClass = () => {
        if (!isVisible) {
            // Start states
            switch (animation) {
                case 'zoom-in': return 'opacity-0 scale-95';
                case 'slide-right': return 'opacity-0 -translate-x-8';
                default: return 'opacity-0 translate-y-8'; // fade-up
            }
        }
        
        // End states (Animations)
        switch (animation) {
            case 'zoom-in': return 'animate-scale-in opacity-100 scale-100';
            case 'slide-right': return 'animate-slide-in-left-fade opacity-100 translate-x-0';
            case 'fade-up': return 'animate-slide-up-fade opacity-100 translate-y-0';
            default: return 'animate-fade-in opacity-100';
        }
    };

    return (
        <div 
            ref={ref} 
            className={`transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${getAnimationClass()} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

export default RevealOnScroll;
