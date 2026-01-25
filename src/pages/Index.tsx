import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BookOpen, Users, Video, Award } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Quality Content",
      description: "Learn from expertly crafted courses and materials designed for excellence",
    },
    {
      icon: Video,
      title: "HD Video Lectures",
      description: "Crystal-clear video lectures accessible anytime, anywhere",
    },
    {
      icon: Users,
      title: "Expert Educators",
      description: "Learn from India's most experienced and qualified teachers",
    },
    {
      icon: Award,
      title: "Structured Path",
      description: "Follow a carefully designed curriculum for optimal learning",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 page-transition">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-8 text-5xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl slideInFromBottom">
              Welcome to
              <br />
              <span className="text-gradient">Pie Wallah</span>
            </h1>
            <p className="mb-12 text-xl text-muted-foreground md:text-2xl leading-relaxed max-w-2xl mx-auto slideInFromBottom" style={{ animationDelay: '200ms' }}>
              Your journey to academic excellence begins here. Learn from the best educators and achieve your goals.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center slideInFromBottom" style={{ animationDelay: '400ms' }}>
              <Link to="/batches">
                <Button size="lg" className="bg-foreground text-background hover:bg-primary-hover shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 px-8 py-4 text-base btn-smooth hover-lift group">
                  Explore Batches
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/my-batches">
                <Button size="lg" variant="outline" className="border-border hover:bg-muted/50 transition-all duration-300 px-8 py-4 text-base btn-smooth hover-lift">
                  My Batches
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-semibold tracking-tight text-foreground slideInFromBottom">Why Choose Pie Wallah?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto slideInFromBottom" style={{ animationDelay: '200ms' }}>
              Everything you need to excel academically, all in one place
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-8 border-border/50 bg-card shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 group card-hover slideInFromBottom" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-muted transition-colors duration-300 group-hover:scale-110">
                  <feature.icon className="h-7 w-7 text-foreground transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed transition-colors duration-300">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-semibold tracking-tight text-foreground slideInFromBottom">
              Ready to Transform Your Learning?
            </h2>
            <p className="mb-12 text-lg text-muted-foreground slideInFromBottom" style={{ animationDelay: '200ms' }}>
              Join thousands of students who are already excelling with our platform
            </p>
            <Link to="/batches">
              <Button size="lg" className="bg-foreground text-background hover:bg-primary-hover shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 px-10 py-4 text-base btn-smooth hover-lift slideInFromBottom" style={{ animationDelay: '400ms' }}>
                Browse All Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
