
import React, { useEffect, useRef, useState } from 'react';

interface RevealOnScrollProps {
    children: React.ReactNode;
    animation?: 'fade-up' | 'slide-right';
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
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: '50px' // Start slightly before
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    const getAnimationClass = () => {
        if (!isVisible) return 'opacity-0 translate-y-8'; // Start state
        
        switch (animation) {
            case 'fade-up': return 'animate-slide-up-fade opacity-100 translate-y-0';
            case 'slide-right': return 'animate-slide-in-left-fade opacity-100 translate-x-0';
            default: return 'animate-fade-in opacity-100';
        }
    };

    return (
        <div 
            ref={ref} 
            className={`transition-all duration-700 ease-out ${getAnimationClass()} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

export default RevealOnScroll;
