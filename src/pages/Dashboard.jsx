import { Chart } from '../components/Chart';
import { CarouselNav, DayIndicators, ConnectionStatus } from '../components/CarouselNav';
import { Stats } from '../components/Stats';
import { useChartData } from '../hooks/useChartData';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
    const { logout } = useAuth();
    const {
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
        canGoPrev,
        canGoNext,
    } = useChartData();

    return (
        <div className="container">
            <header>
                <pre className="ascii-logo">{`
   ████████╗██████╗  █████╗ ██╗  ██╗███╗   ██╗
   ╚══██╔══╝██╔══██╗██╔══██╗██║  ██║████╗  ██║
      ██║   ██████╔╝███████║███████║██╔██╗ ██║
      ██║   ██╔══██╗██╔══██║██╔══██║██║╚██╗██║
      ██║   ██║  ██║██║  ██║██║  ██║██║ ╚████║
      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝`}</pre>
                <button className="logout-btn" onClick={logout}>Logout</button>
            </header>
            
            <CarouselNav 
                currentDay={currentDay}
                availableDays={availableDays}
                currentDayIndex={currentDayIndex}
                isLive={isLive}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                onPrev={navigatePrev}
                onNext={navigateNext}
                onNavigateTo={navigateTo}
            />
            
            <div className="chart-wrapper">
                <Chart prices={prices} trades={trades} />
                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner" />
                        <span>Waiting for data...</span>
                    </div>
                )}
            </div>
            
            <Stats prices={prices} trades={trades} />
            
            <DayIndicators 
                availableDays={availableDays}
                currentDayIndex={currentDayIndex}
                onNavigateTo={navigateTo}
            />
            
            <div className="legend">
                <span className="legend-item">
                    <span className="dot buy-dot" /> Buy (USDC → ETH)
                </span>
                <span className="legend-item">
                    <span className="dot sell-dot" /> Sell (ETH → USDC)
                </span>
            </div>
            
            <ConnectionStatus status={connectionStatus} />
        </div>
    );
}

