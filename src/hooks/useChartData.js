import { useState, useEffect, useCallback, useRef } from 'react';

const CONFIG = {
    dataUrl: '/data/current.json',
    pollIntervalMs: 5000,
    retryIntervalMs: 10000,
};

export function useChartData() {
    const [availableDays, setAvailableDays] = useState([]);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [prices, setPrices] = useState([]);
    const [trades, setTrades] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [loading, setLoading] = useState(true);
    
    const dayCache = useRef({});
    const pollInterval = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(CONFIG.dataUrl + '?t=' + Date.now());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update available days
            let days = [];
            let dayIdx = 0;
            
            if (data.availableDays && data.availableDays.length > 0) {
                days = data.availableDays;
                dayIdx = days.indexOf(data.currentDay);
                if (dayIdx === -1) dayIdx = days.length - 1;
            } else if (data.currentDay) {
                days = [data.currentDay];
                dayIdx = 0;
            }
            
            setAvailableDays(days);
            setCurrentDayIndex(dayIdx);
            
            // Cache current day data
            if (data.prices && data.currentDay) {
                dayCache.current[data.currentDay] = {
                    prices: data.prices,
                    trades: data.trades || []
                };
            }
            
            // If viewing live day, update chart
            if (dayIdx === days.length - 1) {
                setIsLive(true);
                setPrices(data.prices || []);
                setTrades(data.trades || []);
            }
            
            setConnectionStatus('connected');
            setLoading(false);
            
        } catch (error) {
            console.warn('Failed to fetch data:', error.message);
            setConnectionStatus('waiting');
            
            // Retry after delay
            setTimeout(fetchData, CONFIG.retryIntervalMs);
        }
    }, []);

    const fetchDayData = useCallback(async (day) => {
        // Check cache first
        if (dayCache.current[day]) {
            setPrices(dayCache.current[day].prices);
            setTrades(dayCache.current[day].trades);
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch(`/data/${day}.json?t=` + Date.now());
            if (response.ok) {
                const data = await response.json();
                dayCache.current[day] = {
                    prices: data.prices || [],
                    trades: data.trades || []
                };
                setPrices(data.prices || []);
                setTrades(data.trades || []);
            } else {
                setPrices([]);
                setTrades([]);
            }
        } catch (error) {
            console.warn(`Failed to fetch data for ${day}:`, error.message);
            setPrices([]);
            setTrades([]);
        }
        
        setLoading(false);
    }, []);

    const navigateTo = useCallback((index) => {
        if (index < 0 || index >= availableDays.length) return;
        
        setCurrentDayIndex(index);
        const day = availableDays[index];
        const isLiveDay = index === availableDays.length - 1;
        setIsLive(isLiveDay);
        
        fetchDayData(day);
    }, [availableDays, fetchDayData]);

    const navigatePrev = useCallback(() => {
        if (currentDayIndex > 0) {
            navigateTo(currentDayIndex - 1);
        }
    }, [currentDayIndex, navigateTo]);

    const navigateNext = useCallback(() => {
        if (currentDayIndex < availableDays.length - 1) {
            navigateTo(currentDayIndex + 1);
        }
    }, [currentDayIndex, availableDays.length, navigateTo]);

    // Initial fetch and polling
    useEffect(() => {
        fetchData();
        
        pollInterval.current = setInterval(() => {
            // Only poll if viewing live day
            if (isLive) {
                fetchData();
            }
        }, CONFIG.pollIntervalMs);
        
        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [fetchData, isLive]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') navigatePrev();
            if (e.key === 'ArrowRight') navigateNext();
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [navigatePrev, navigateNext]);

    const currentDay = availableDays[currentDayIndex] || null;

    return {
        prices,
        trades,
        availableDays,
        currentDayIndex,
        currentDay,
        isLive,
        loading,
        connectionStatus,
        navigatePrev,
        navigateNext,
        navigateTo,
        canGoPrev: currentDayIndex > 0,
        canGoNext: currentDayIndex < availableDays.length - 1,
    };
}

