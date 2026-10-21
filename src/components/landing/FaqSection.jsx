import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQS } from '@/lib/constants';

export default function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Frequently asked questions</h2>
      <Accordion type="single" collapsible className="mt-6">
        {FAQS.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger className="text-left text-sm font-medium">{item.question}</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}